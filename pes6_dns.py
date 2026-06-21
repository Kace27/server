#!/usr/bin/env python3
"""
Servidor DNS Local (Micro-DNS) para PES 6.
Intercepta consultas de los dominios de PES 6 y las redirige a la IP local del Mac.
"""

import socket
import argparse
import sys
import datetime

# Dominios objetivo de PES 6
TARGET_DOMAINS = [
    b"pes6gate-ec",
    b"pes6gate-eu",
    b"pes6gate-ee",
    b"we9stun",
    b"winning-eleven.net",
    b"pes6.es"
]

def get_local_ip():
    """Intenta obtener la IP de la red local automáticamente."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "192.168.100.5"

def build_dns_response(data, ip_address):
    """Construye una respuesta DNS falsa apuntando a la IP dada."""
    # Transaction ID (2 bytes)
    transaction_id = data[:2]
    # Flags: Standard query response, No error
    flags = b"\x81\x80"
    # Questions (2 bytes), Answer RRs (2 bytes), Authority RRs (2 bytes), Additional RRs (2 bytes)
    counts = b"\x00\x01\x00\x01\x00\x00\x00\x00"
    
    # Encontrar el final de la sección Question (QNAME + QTYPE + QCLASS)
    # QNAME empieza en el byte 12
    idx = 12
    while idx < len(data):
        length = data[idx]
        if length == 0:
            idx += 1
            break
        idx += 1 + length
        
    # QTYPE y QCLASS ocupan 2 bytes cada uno (4 bytes en total)
    question_end = idx + 4
    question = data[12:question_end]
    
    # Answer section:
    # Pointer to domain name at offset 12 (0xc00c)
    name_pointer = b"\xc0\x0c"
    # Type A (1), Class IN (1)
    type_class = b"\x00\x01\x00\x01"
    # TTL (e.g. 60 seconds)
    ttl = b"\x00\x00\x00\x3c"
    # Data length (4 bytes for IPv4)
    data_length = b"\x00\x04"
    # IP Address bytes
    ip_bytes = bytes(map(int, ip_address.split(".")))
    
    answer = name_pointer + type_class + ttl + data_length + ip_bytes
    return transaction_id + flags + counts + question + answer

def parse_qname(data):
    """Extrae el nombre de dominio (QNAME) de una consulta DNS."""
    try:
        idx = 12
        labels = []
        while idx < len(data):
            length = data[idx]
            if length == 0:
                break
            labels.append(data[idx+1:idx+1+length].decode('utf-8', errors='ignore').lower())
            idx += 1 + length
        return ".".join(labels)
    except Exception:
        return ""

def main():
    parser = argparse.ArgumentParser(description="Micro Servidor DNS para PES 6")
    parser.add_argument("--ip", type=str, default=get_local_ip(),
                        help="La dirección IP a la que resolverán los dominios (por defecto: tu IP local autodetectada).")
    args = parser.parse_args()
    
    ip = args.ip
    port = 53
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.bind(("0.0.0.0", port))
    except PermissionError:
        print(f"[!] Error: Permiso denegado para usar el puerto {port}.")
        print("[!] En macOS, los puertos menores a 1024 requieren permisos de administrador.")
        print("[!] Por favor, ejecuta este script usando 'sudo'.")
        print(f"[!] Comando correcto: sudo python3 {sys.argv[0]}")
        sys.exit(1)
    except OSError as e:
        if e.errno == 48:
            print(f"[!] Error: El puerto {port} ya está en uso.")
            print("[!] Parece que ya hay otro servicio DNS activo (quizás mDNSResponder u otro contenedor).")
        else:
            print(f"[!] Error al iniciar el servidor DNS: {e}")
        sys.exit(1)
        
    print("=" * 60)
    print(" ⚽  Servidor DNS de PES 6 Iniciado Exitosamente  ⚽")
    print("=" * 60)
    print(f" [*] Escuchando en el puerto UDP : {port}")
    print(f" [*] Resolviendo dominios hacia  : {ip}")
    print(" [*] Presiona Ctrl+C para detener el servicio.")
    print("-" * 60)
    
    try:
        while True:
            data, addr = sock.recvfrom(512)
            
            # Verificamos si es una consulta para nuestros dominios
            qname = parse_qname(data)
            if any(domain in qname for domain in ["pes6gate-ec", "pes6gate-eu", "pes6gate-ee", "we9stun", "winning-eleven.net", "pes6.es"]):
                try:
                    # Resolvemos a la IP del servidor local/VM
                    resolved_ip = ip
                    
                    # Redirigir consultas STUN al servidor STUN real de pes6.es (46.101.172.11)
                    # Este servidor tiene múltiples IPs y cumple con los requisitos STUN estrictos de PES 6.
                    if "stun" in qname:
                        resolved_ip = "46.101.172.11"
                        
                    response = build_dns_response(data, resolved_ip)
                    sock.sendto(response, addr)
                    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    print(f"[{timestamp}] Consulta interceptada de {addr[0]} -> {qname} -> Resuelta a {resolved_ip}")
                except Exception as e:
                    print(f"[!] Error construyendo respuesta: {e}")
    except KeyboardInterrupt:
        print("\n\n[*] Deteniendo servidor DNS... ¡Hasta luego!")
        sock.close()
        sys.exit(0)

if __name__ == "__main__":
    main()
